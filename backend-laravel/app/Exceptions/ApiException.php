<?php

namespace App\Exceptions;

use Exception;

class ApiException extends Exception
{
    protected int $statusCode;
    public ?array $details;

    public function __construct(string $message, int $statusCode = 400, ?array $details = null)
    {
        parent::__construct($message, $statusCode);
        $this->statusCode = $statusCode;
        $this->details = $details;
    }

    public function getStatusCode(): int
    {
        return $this->statusCode;
    }
}
